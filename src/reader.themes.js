var Themes = {
  // |-----------|
  // |           |
  // |  screen   |
  // |           |
  // |-----------|
  // |  nombre   |
  // |-----------|
  "1x1":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // screen
    "<div style='margin:{{space}}px'>{{0}}</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{page_no}} -",
    "</div>"
  ].join(""),

  // |----------------|----------------|
  // |                |                |
  // |  left          | right          |
  // |                |                |
  // |----------------|----------------|
  // |  left nombre   | right nombre   |
  // |----------------|----------------|
  "1x2":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // left
    "<div class='nehan-reader-left'>",
    "<div style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px;'>",
    "{{0}}",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // left nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{left_page_no}} -",
    "</div>",
    "</div>",

    // right
    "<div class='nehan-reader-right'>",
    "<div style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px;'>",
    "{{1}}",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // right nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{right_page_no}} -",
    "</div>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>"
  ].join(""),

  // |-----------|
  // |  upside   |
  // |-----------|
  // |  downside |
  // |-----------|
  // |  nombre   |
  // |-----------|
  "2x1":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // upside
    "<div class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-bottom:{{space}}px;'>",
    "{{0}}",
    "</div>",

    // downside
    "<div class='nehan-reader-row nehan-reader-row-bottom' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-left:{{space}}px;'>",
    "{{1}}",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{page_no}} -",
    "</div>"

  ].join(""),

  // |----------------|----------------|
  // |  left upside   | right upside   |
  // |----------------|----------------|
  // |  left downside | right downside |
  // |----------------|----------------|
  // |  left nombre   | right nombre   |
  // |----------------|----------------|
  "2x2":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // left
    "<div class='nehan-reader-left'>",

    // left upside
    "<div class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px; padding-bottom:{{space}}px'>",
    "{{2}}",
    "</div>",

    // left downside
    "<div class='nehan-reader-row' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px;'>",
    "{{3}}",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // left nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{left_page_no}} -",
    "</div>",
    "</div>", // nehan-reader-left

    // right
    "<div class='nehan-reader-right'>",

    // right upside
    "<div class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px; padding-bottom:{{space}}px'>",
    "{{0}}",
    "</div>",

    // right downside
    "<div class='nehan-reader-row' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px;'>",
    "{{1}}",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // right nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{right_page_no}} -",
    "</div>",
    "</div>", // nehan-reader-right

    "<div class='nehan-reader-clearfix'></div>"
  ].join("")
};
